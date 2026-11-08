export function visiblePost(post, canReadMembers) {
  if (!post?.membersOnly || canReadMembers) return post;

  return {
    id: post.id || post._id?.toString(),
    membersOnly: true,
    locked: true,
    type: post.type,
    pinned: post.pinned,
    published: post.published,
    status: post.status,
    createdAt: post.createdAt,
    slug: post.slug,
    ...(post.slug ? { title: "Log in to view" } : {}),
  };
}
