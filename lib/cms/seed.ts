import content from "./initial-content.json";
import { documentSchema } from "./schema";

export const initialDocument = documentSchema.parse(content);
