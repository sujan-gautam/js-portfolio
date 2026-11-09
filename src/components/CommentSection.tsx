import { useId, useState, type FormEvent, type ReactElement } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { isAxiosError } from "axios";
import { X } from "lucide-react";
import { feedAPI, type FeedComment, type FeedPost } from "@/lib/adminData";
import { getVoterId, timeAgo } from "@/lib/feedUtils";

type CommentSectionProps = {
  post: FeedPost;
  onCommentsChange: (comments: FeedComment[]) => void;
  trigger?: ReactElement;
};

function CommentThread({ post, onCommentsChange, inDialog = false }: Omit<CommentSectionProps, "trigger"> & { inDialog?: boolean }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [voterId] = useState(getVoterId);
  const comments = post.comments ?? [];
  const hasCommented = comments.some((comment) => comment.votersId === voterId);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const comment = text.trim();
    if (!comment || submitting || hasCommented) return;

    setSubmitting(true);
    setError("");
    try {
      const updated = await feedAPI.addComment(post.id, comment, "Anonymous", voterId);
      onCommentsChange(updated.comments ?? []);
      setText("");
      const title = post.articleTitle || post.content?.substring(0, 30) || "Post";
      (window as any).reportActivity?.("comment_story", `Commented on post: ${title}`, "Submitted a comment");
    } catch (error) {
      const message = isAxiosError<{ error?: string }>(error) ? error.response?.data?.error : undefined;
      setError(message || "Couldn’t post your comment. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const composer = (
    <div className={inDialog ? "shrink-0 border-t border-border p-4 sm:px-5" : "mt-4"}>
      {hasCommented ? (
        <p className="text-sm text-muted-foreground" role="status">You’ve already commented on this post.</p>
      ) : (
        <form onSubmit={submit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Add a comment</span>
            <textarea
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                if (error) setError("");
              }}
              rows={2}
              placeholder="Write a comment…"
              className="block w-full resize-y rounded-md border border-border bg-card px-3 py-2.5 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
            {error && <p role="alert" className="min-w-0 flex-1 break-words text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="inline-flex min-h-11 shrink-0 items-center rounded-md bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-40"
            >
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const thread = (
    <div className={inDialog ? "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5" : "mt-5"}>
      {comments.length ? (
        <ul className="divide-y divide-border">
          {comments.map((comment, index) => {
            const date = new Date(comment.createdAt);
            return (
              <li key={comment.id || index} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium text-foreground">Anonymous</span>
                  {Number.isFinite(date.getTime()) && (
                    <time dateTime={date.toISOString()} className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</time>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">{comment.text}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      )}
    </div>
  );

  return inDialog ? <>{thread}{composer}</> : <>{composer}{thread}</>;
}

export function CommentSection({ trigger, ...props }: CommentSectionProps) {
  const headingId = useId();
  const count = props.post.comments?.length ?? 0;

  if (trigger) {
    return (
      <Dialog.Root>
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[99998] bg-black/70" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-[99999] mx-auto flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-xl border border-border bg-background font-inter text-foreground sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-xl"
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-2 sm:px-5">
              <Dialog.Title className="font-semibold">Comments{count > 0 ? ` (${count})` : ""}</Dialog.Title>
              <Dialog.Close aria-label="Close comments" className="grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X size={19} aria-hidden="true" />
              </Dialog.Close>
            </div>
            <CommentThread {...props} inDialog />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <section aria-labelledby={headingId} className="mt-6 border-t border-border pt-5 font-inter">
      <h2 id={headingId} className="text-lg font-semibold">
        Comments{count > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">{count}</span>}
      </h2>
      <CommentThread {...props} />
    </section>
  );
}
