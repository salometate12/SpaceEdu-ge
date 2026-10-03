// The parser alone, without the package entry point's debug self-test.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdfParse from "pdf-parse";
  export default pdfParse;
}
