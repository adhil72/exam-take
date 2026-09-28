import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

export default function MdPreview({ value, className, minimal }: { value: string, className?: string, minimal?: boolean }) {
    if (minimal) {
        return (
            <span className={cn("text-foreground text-sm inline", className)}>
                <ReactMarkdown
                    children={value}
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={{
                        h1: ({ children }) => <span className="font-semibold">{children} </span>,
                        h2: ({ children }) => <span className="font-semibold">{children} </span>,
                        h3: ({ children }) => <span className="font-semibold">{children} </span>,
                        h4: ({ children }) => <span className="font-semibold">{children} </span>,
                        h5: ({ children }) => <span className="font-semibold">{children} </span>,
                        h6: ({ children }) => <span className="font-semibold">{children} </span>,
                        p: ({ children }) => <span>{children} </span>,
                        a: ({ children }) => <span className="text-primary">{children}</span>,
                        strong: ({ children }) => <strong>{children}</strong>,
                        em: ({ children }) => <em>{children}</em>,
                        ul: ({ children }) => <span>{children}</span>,
                        ol: ({ children }) => <span>{children}</span>,
                        li: ({ children }) => <span>• {children} </span>,
                        blockquote: ({ children }) => <span className="text-muted-foreground italic">{children}</span>,
                        code: ({ children }) => <code className="bg-muted px-1 rounded text-xs">{children}</code>,
                        pre: ({ children }) => <span>{children}</span>,
                        // Figures are black-on-white/transparent, so give them a white plate to stay readable in dark mode
                        img: ({ src, alt }) => <img src={src} alt={alt || ""} loading="lazy" className="inline-block max-h-48 max-w-full rounded bg-white p-1 align-middle" />,
                        video: () => <span className="text-muted-foreground">[video]</span>,
                        iframe: () => <span className="text-muted-foreground">[embed]</span>,
                        hr: () => <span> — </span>,
                        br: () => <span> </span>,
                        table: () => <span className="text-muted-foreground">[table]</span>,
                        thead: () => null,
                        tbody: () => null,
                        tr: () => null,
                        th: () => null,
                        td: () => null,
                    }}
                />
            </span>
        );
    }

    return (
        <div className={cn("text-foreground", className)}>
            <ReactMarkdown
                children={value}
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                    h1: ({ className, ...props }) => (
                        <h1
                            className={cn(
                                "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-4",
                                className
                            )}
                            {...props}
                        />
                    ),
                    h2: ({ className, ...props }) => (
                        <h2
                            className={cn(
                                "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4 mt-8",
                                className
                            )}
                            {...props}
                        />
                    ),
                    h3: ({ className, ...props }) => (
                        <h3
                            className={cn(
                                "scroll-m-20 text-2xl font-semibold tracking-tight mb-4 mt-6",
                                className
                            )}
                            {...props}
                        />
                    ),
                    h4: ({ className, ...props }) => (
                        <h4
                            className={cn(
                                "scroll-m-20 text-xl font-semibold tracking-tight mb-4 mt-6",
                                className
                            )}
                            {...props}
                        />
                    ),
                    p: ({ className, ...props }) => (
                        <p
                            className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
                            {...props}
                        />
                    ),
                    a: ({ className, ...props }) => (
                        <a
                            className={cn("font-medium text-primary underline underline-offset-4", className)}
                            {...props}
                        />
                    ),
                    blockquote: ({ className, ...props }) => (
                        <blockquote
                            className={cn("mt-6 border-l-2 pl-6 italic text-muted-foreground", className)}
                            {...props}
                        />
                    ),
                    ul: ({ className, ...props }) => (
                        <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)} {...props} />
                    ),
                    ol: ({ className, ...props }) => (
                        <ol className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)} {...props} />
                    ),
                    img: ({ className, alt, ...props }) => (
                        <img
                            alt={alt || ""}
                            loading="lazy"
                            className={cn("my-3 max-h-[420px] max-w-full rounded-md bg-white p-2", className)}
                            {...props}
                        />
                    ),
                    hr: ({ ...props }) => <hr className="my-4 md:my-8" {...props} />,
                    table: ({ className, ...props }) => (
                        <div className="my-6 w-full overflow-y-auto">
                            <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
                        </div>
                    ),
                    tr: ({ className, ...props }) => (
                        <tr
                            className={cn("m-0 border-t p-0 even:bg-muted", className)}
                            {...props}
                        />
                    ),
                    th: ({ className, ...props }) => (
                        <th
                            className={cn(
                                "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
                                className
                            )}
                            {...props}
                        />
                    ),
                    td: ({ className, ...props }) => (
                        <td
                            className={cn(
                                "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
                                className
                            )}
                            {...props}
                        />
                    ),
                    pre: ({ className, ...props }) => (
                        <pre
                            className={cn(
                                "mb-4 mt-6 overflow-x-auto rounded-lg border bg-muted px-4 py-3 text-sm [&_code]:bg-transparent [&_code]:p-0 [&_code]:font-normal [&_code]:text-foreground",
                                className
                            )}
                            {...props}
                        />
                    ),
                    code: ({ className, ...props }) => (
                        <code
                            className={cn(
                                "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
                                className
                            )}
                            {...props}
                        />
                    ),
                }}
            />
        </div>
    );
}
