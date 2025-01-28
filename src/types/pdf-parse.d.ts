declare module "pdf-parse" {
  interface PDFInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
  }

  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: Record<string, unknown>;
    version: string;
  }

  interface TextContent {
    items: Array<{ str: string }>;
    styles: Record<string, unknown>;
  }

  interface PDFOptions {
    pagerender?: (pageData: {
      getTextContent: () => Promise<TextContent>;
    }) => Promise<string>;
    max?: number;
    version?: string;
  }

  function PDFParse(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData>;

  export = PDFParse;
}
