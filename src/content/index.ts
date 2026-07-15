import { notes } from "./loader/loadNotes";
import { buildNavigation } from "./builders/navigation";

export const navigation = buildNavigation(notes);

export { notes };