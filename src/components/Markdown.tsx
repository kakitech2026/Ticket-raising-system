import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
export function ArticleMarkdown({content}:{content:string}){return <div className="markdown max-w-[75ch] break-words"><Markdown remarkPlugins={[remarkGfm]} skipHtml disallowedElements={["img"]}>{content}</Markdown></div>;}