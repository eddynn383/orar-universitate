import { cn } from "@/lib/utils";

type CommonProps<T = {}> = React.HTMLAttributes<HTMLHeadingElement> & T;

type H1Props = CommonProps;

type H2Props = CommonProps;

type H3Props = CommonProps;

type H4Props = CommonProps;

type PProps = CommonProps;

type BlockquoteProps = CommonProps;

const H1 = (props: H1Props) => {
    return (
        <h1 className={cn(
            "scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance",
            props.className
        )}>
            {props.children}
        </h1>
    )
}

const H2 = (props: H2Props) => {
    return (
        <h2 className={cn(
            "scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0",
            props.className
        )}>
            {props.children}
        </h2>
    )
}

const H3 = (props: H3Props) => {
    return (
        <h3 className={cn(
            "scroll-m-20 text-2xl font-semibold tracking-tight",
            props.className
        )}>
            {props.children}
        </h3>
    )
}

const H4 = (props: H4Props) => {
    return (
        <h4 className={cn(
            "scroll-m-20 text-xl font-semibold tracking-tight",
            props.className
        )}>
            {props.children}
        </h4>
    )
}

const P = (props: PProps) => {
    return (
        <p className={cn(
            "leading-7 [&:not(:first-child)]:mt-6",
            props.className
        )}>
            {props.children}
        </p>
    )
}

const Blockquote = (props: BlockquoteProps) => {
    return (
        <blockquote className={cn(
            "mt-6 border-l-2 pl-6 italic",
            props.className
        )}>
            {props.children}
        </blockquote>
    )
}

export { H1, H2, H3, H4, P, Blockquote };