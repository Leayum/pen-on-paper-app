// src/lib/canvasUtils.ts
import { toast } from "sonner";

// --- Lógica de Carga de URL (extraída de SimpleEditor) ---

const toDataURL = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readDataURL(blob);
    });
    
const imageProxyCandidates = (u: string) => {
    const stripped = u.replace(/^https?:\/\//, "");
    return [
        u,
        `https://corsproxy.io/?${encodeURIComponent(u)}`,
        `https://cors.isomorphic-git.org/${u}`,
        `https://thingproxy.freeboard.io/fetch/${u}`,
        `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}`,
        `https://cdn.statically.io/img/${stripped}`,
    ];
};

async function tryLoadImageUrl(u: string, successMsg = "Imagen cargada desde URL"): Promise<string | null> {
    for (const url of imageProxyCandidates(u)) {
        try {
            const res = await fetch(url, { mode: "cors" as RequestMode });
            if (!res.ok) continue;
            const ct = res.headers.get("content-type") || "";
            if (!ct.startsWith("image/")) continue;
            const blob = await res.blob();
            const dataUrl = await toDataURL(blob);
            toast.success(successMsg);
            return dataUrl;
        } catch (_) {
            // intentar siguiente opción
        }
    }
    return null;
};

export async function loadImageFromUrl(rawUrl: string): Promise<string | null> {
     if (!rawUrl.trim()) {
      toast.error("Por favor ingresa una URL válida");
      return null;
    }

    toast.info("Cargando imagen desde URL...");
    let workingUrl = rawUrl.trim();

      // Resolver enlaces cortos de Pinterest (pin.it) y extraer imagen de páginas de pines
  const isPinItShort = /^https?:\/\/(?:www\.)?pin\.it\//i.test(workingUrl);
  if (isPinItShort) {
    const resolveCandidates = [
      `https://r.jina.ai/http/${workingUrl.replace(/^https?:\/\//, "")}`,
      `https://r.jina.ai/https/${workingUrl.replace(/^https?:\/\//, "")}`,
    ];

    for (const url of resolveCandidates) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const html = await res.text();

        // Intentar imagen directa primero
        const pinimgMatch = html.match(/https?:\/\/i\.pinimg\.com\/[\w\/-]+\.(?:jpg|jpeg|png|webp)/i);
        if (pinimgMatch) {
          const loadedDataUrl = await tryLoadImageUrl(pinimgMatch[0], "Imagen cargada desde Pinterest");
          if (loadedDataUrl) return loadedDataUrl;
        }

        // Resolver a URL de pin de Pinterest
        const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
        const ogUrlMatch = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
        const pinLinkMatch = html.match(/https?:\/\/(?:\w+\.)?pinterest\.[^"'\s]+\/pin\/\d+/i);

        const resolved = (canonicalMatch && canonicalMatch[1]) || (ogUrlMatch && ogUrlMatch[1]) || (pinLinkMatch && pinLinkMatch[0]) || null;
        if (resolved) {
          workingUrl = resolved;
          break; // Pasar a la lógica de página de pin
        }
      } catch {}
    }
  }

  // Soporte para páginas de pines de Pinterest (no solo URL directa de imagen)
  const isPinterestPin = /pinterest\.[^\/]+\/pin\//i.test(workingUrl);
  if (isPinterestPin) {
    // Intentar obtener el HTML y extraer la imagen (og:image, ld+json o cualquier i.pinimg.com)
    const htmlCandidates = [
      `https://r.jina.ai/http/${workingUrl.replace(/^https?:\/\//, "")}`,
      `https://r.jina.ai/https/${workingUrl.replace(/^https?:\/\//, "")}`,
      `https://corsproxy.io/?${encodeURIComponent(workingUrl)}`,
      `https://thingproxy.freeboard.io/fetch/${workingUrl}`,
    ];

    for (const url of htmlCandidates) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const html = await res.text();

        // 1) og:image / og:image:secure_url
        const ogMatch =
          html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i);

        let extractedUrl: string | null = null;
        if (ogMatch && ogMatch[1]) {
          extractedUrl = ogMatch[1];
        }

        // 2) Buscar en scripts ld+json un contentUrl o image
        if (!extractedUrl) {
          const ldjsonRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
          let m: RegExpExecArray | null;
          while ((m = ldjsonRegex.exec(html))) {
            try {
              const json = JSON.parse(m[1]);
              const arr = Array.isArray(json) ? json : [json];
              for (const obj of arr) {
                const cand = (obj && (obj.contentUrl || (typeof obj.image === 'string' ? obj.image : null))) as string | undefined;
                if (cand) {
                  extractedUrl = cand;
                  break;
                }
              }
              if (extractedUrl) break;
            } catch {}
          }
        }

        // 3) Fallback: cualquier URL de i.pinimg.com con extensión de imagen
        if (!extractedUrl) {
          const pinimgMatch = html.match(/https?:\/\/i\.pinimg\.com\/[\w\/-]+\.(?:jpg|jpeg|png|webp)/i);
          if (pinimgMatch) extractedUrl = pinimgMatch[0];
        }

        if (extractedUrl) {
          try {
            // Intentar obtener versión de mayor resolución
            extractedUrl = extractedUrl.replace(/\/(\d+)x\//, "/originals/");
          } catch {}
          const loadedDataUrl = await tryLoadImageUrl(extractedUrl, "Imagen cargada desde Pinterest");
          if (loadedDataUrl) return loadedDataUrl;
        }
      } catch {}
    }

    toast.error("No se pudo extraer la imagen del pin de Pinterest. Prueba con el enlace directo de la imagen.");
    return null;
  }

    // Carga directa si no es Pinterest
    const loadedDataUrl = await tryLoadImageUrl(workingUrl);
    if (loadedDataUrl) {
        return loadedDataUrl;
    } else {
        toast.error("No se pudo cargar la imagen. Prueba con un enlace directo (.jpg, .png) o descarga el archivo.");
        return null;
    }
}

// --- Lógica de Dibujo en Canvas (extraída y adaptada de SimpleEditor) ---

// Tipos necesarios
type TextStyle = { bold: boolean; italic: boolean; };
interface StyledSegment { text: string; style: TextStyle; }
interface StyledWord { text: string; style: TextStyle; }

interface DrawTextOptions {
    author?: string;
    inkColor: string;
    fontSize: number;
    aspectRatio: "1:1" | "9:16";
    baseTextStyle: "normal" | "bold" | "italic";
    authorTextStyle: "normal" | "bold" | "italic";
    authorFontSize: number;
    imagePosition: { x: number; y: number };
    imageScale: number;
}

export function drawTextOnCanvas(
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    text: string,
    options: DrawTextOptions
): boolean {
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const {
        author,
        inkColor,
        fontSize,
        aspectRatio,
        baseTextStyle,
        authorTextStyle,
        authorFontSize,
        imagePosition,
        imageScale
    } = options;

    // Establecer tamaño del canvas basado en aspect ratio
    if (aspectRatio === "1:1") {
        canvas.width = 1080;
        canvas.height = 1080;
    } else {
        canvas.width = 1080;
        canvas.height = 1920;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar imagen de fondo
     const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;
    let drawWidth, drawHeight, offsetX, offsetY;
    if (imgAspect > canvasAspect) {
      drawHeight = canvas.height * imageScale;
      drawWidth = img.width * (drawHeight / img.height);
      offsetX = (canvas.width - drawWidth) / 2 + imagePosition.x;
      offsetY = 0;
    } else {
      drawWidth = canvas.width * imageScale;
      drawHeight = img.height * (drawWidth / img.width);
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2 + imagePosition.y;
    }
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // Dibujar texto principal si existe
    if (text.trim()) {
        ctx.fillStyle = inkColor;
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        const maxWidth = canvas.width * 0.8;
        const lineHeight = fontSize * 1.4;

        const getBaseStyle = (): TextStyle => ({
            bold: baseTextStyle === "bold",
            italic: baseTextStyle === "italic",
        });

        const applyMarkerStyle = (baseStyle: TextStyle, marker: "bold" | "italic"): TextStyle => {
             if (marker === "bold") return { ...baseStyle, bold: !baseStyle.bold };
             return { ...baseStyle, italic: !baseStyle.italic };
        };

       const getFontString = (style: TextStyle, size: number): string => {
            const parts: string[] = [];
            if (style.bold) parts.push("bold");
            if (style.italic) parts.push("italic");
            parts.push(`${size}px`);
            // Usar una fuente genérica como fallback si es necesario, o pasarla en options
            parts.push("Arial"); // Podríamos necesitar pasar la fuente real aquí
            return parts.join(" ");
        };

        const paragraphs = text.split("\n");
        const lines: StyledWord[][] = [];

        paragraphs.forEach((paragraph) => {
            if (paragraph.trim() === "") {
                lines.push([]); return;
            }
            const segments: StyledSegment[] = [];
            let remaining = paragraph;
            let currentStyle = getBaseStyle();
            let safetyCounter = 0; const maxIterations = 1000;

            while (remaining.length > 0 && safetyCounter < maxIterations) {
                safetyCounter++;
                const boldMatch = remaining.match(/^\*\*([^\*]+)\*\*/);
                if (boldMatch) {
                    segments.push({ text: boldMatch[1], style: applyMarkerStyle(currentStyle, "bold") });
                    remaining = remaining.slice(boldMatch[0].length); continue;
                }
                const italicMatch = remaining.match(/^_([^_]+)_/);
                if (italicMatch) {
                    segments.push({ text: italicMatch[1], style: applyMarkerStyle(currentStyle, "italic") });
                    remaining = remaining.slice(italicMatch[0].length); continue;
                }
                const nextMarker = remaining.search(/\*\*|_/);
                if (nextMarker === -1) {
                    segments.push({ text: remaining, style: currentStyle }); remaining = "";
                } else if (nextMarker === 0) {
                    segments.push({ text: remaining[0], style: currentStyle }); remaining = remaining.slice(1);
                } else {
                    segments.push({ text: remaining.slice(0, nextMarker), style: currentStyle }); remaining = remaining.slice(nextMarker);
                }
            }

            const words: StyledWord[] = [];
            segments.forEach(seg => {
                seg.text.split(/(\s+)/).forEach(w => {
                    if (w.length > 0) words.push({ text: w, style: seg.style });
                });
            });

            let currentLine: StyledWord[] = [];
            let currentLineWidth = 0;
            words.forEach((word) => {
                ctx.font = getFontString(word.style, fontSize);
                const wordWidth = ctx.measureText(word.text).width;
                if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0 && !/^\s+$/.test(word.text)) {
                    lines.push([...currentLine]);
                    currentLine = [word]; currentLineWidth = wordWidth;
                } else {
                    currentLine.push(word); currentLineWidth += wordWidth;
                }
            });
            if (currentLine.length > 0) lines.push(currentLine);
        });

        const startY = canvas.height / 2 - (lines.length * lineHeight) / 2;
        lines.forEach((line, lineIndex) => {
            if (line.length === 0) return;
            let lineWidth = 0;
            line.forEach(word => {
                ctx.font = getFontString(word.style, fontSize);
                lineWidth += ctx.measureText(word.text).width;
            });
            let x = (canvas.width - lineWidth) / 2;
            const y = startY + lineIndex * lineHeight;
            line.forEach(word => {
                ctx.font = getFontString(word.style, fontSize);
                ctx.textAlign = "left";
                ctx.fillText(word.text, x, y);
                x += ctx.measureText(word.text).width;
            });
        });
    }

     // Dibuja el autor si existe
    if (author?.trim()) {
        const textLinesCount = text.trim() ? lines.length : 0; // Usar 'lines' calculado arriba
        const mainLineHeight = fontSize * 1.4;
        const mainTextStartY = canvas.height / 2 - (textLinesCount * mainLineHeight) / 2;

        const extraSpacingFactor = 3.5;
        const authorY = mainTextStartY + textLinesCount * mainLineHeight + authorFontSize * 0.8 + mainLineHeight * extraSpacingFactor;
        const authorX = canvas.width * 0.9 - authorFontSize * 0.5;

        const authorStyle: TextStyle = {
            bold: authorTextStyle === "bold",
            italic: authorTextStyle === "italic"
        };
        ctx.font = getFontString(authorStyle, authorFontSize);
        ctx.textAlign = "right";
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(author.trim(), authorX, authorY);
    }

    // Resetear sombra para que no afecte a otros dibujos si los hubiera
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    return true; // Indicar éxito
}
