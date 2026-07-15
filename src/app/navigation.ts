import { notes } from "../content/loader/loadNotes";
import { buildNavigation } from "../content/builders/navigation";

export const navigation = buildNavigation(notes);