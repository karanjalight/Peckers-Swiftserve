declare module "jspdf" {
  // Minimal typing to satisfy TypeScript in this project.
  // The actual jsPDF API is richer; refer to official docs for more.
  export class jsPDF {
    constructor(options?: any);
    text(
      text: string | string[],
      x: number,
      y: number,
      options?: { align?: string }
    ): this;
    rect(x: number, y: number, w: number, h: number, style?: string): this;
    setFillColor(r: number, g: number, b: number): this;
    setTextColor(r: number | string, g?: number, b?: number): this;
    setFontSize(size: number): this;
    setDrawColor(r: number, g: number, b: number): this;
    setLineWidth(width: number): this;
    line(x1: number, y1: number, x2: number, y2: number): this;
    splitTextToSize(text: string, maxWidth: number): string[];
    addPage(): this;
    save(filename?: string): void;
    output(type: "blob"): Blob;
    internal: { pageSize: { getWidth(): number; getHeight(): number } };
  }
}


