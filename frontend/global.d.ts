// CSS Module declarations
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Image declarations  
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
