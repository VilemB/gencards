import { Buffer } from "buffer";

export async function extractTextFromDocument(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  if (file.type === "application/pdf") {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      text = data.text;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error("Failed to extract text from PDF");
    }
  } else if (file.type === "text/plain") {
    text = buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported file type");
  }

  return text;
}
