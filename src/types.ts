export interface Novel {
  id: number;
  name: string;
  volumes: Array<Volume>;
}

export interface Volume {
  id: number;
  novelId: number;
  no: number;
  name: string;
  cover: URL;
  chapters: Array<Chapter>;
}

export interface Chapter {
  id: number;
  volumeId: number;
  novelId: number;
  no: number;
  name: string;
  content: Array<ChapterContentElement>;
}

interface ChapterContentElementBase<T extends string & {}> {
  type: T;
}

export interface ChapterContentParagraph extends ChapterContentElementBase<"paragraph"> {
  text: string;
}

export interface ChapterContentCenter extends ChapterContentElementBase<"center"> {
  text: string;
}

export interface ChapterContentImage extends ChapterContentElementBase<"image"> {
  url: string;
}

export interface ChapterContentNewline extends ChapterContentElementBase<"newline"> {}

export type ChapterContentElement =
  | ChapterContentParagraph
  | ChapterContentCenter
  | ChapterContentImage
  | ChapterContentNewline;
