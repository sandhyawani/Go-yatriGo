export const sortStoriesList = (otherStories, myUserId) => {
  if (!otherStories) return [];
  return [...otherStories].sort((a, b) => {
    const aHasUnviewed = a.stories?.some(
      (s) => !s.viewedBy?.includes(myUserId)
    );
    const bHasUnviewed = b.stories?.some(
      (s) => !s.viewedBy?.includes(myUserId)
    );
    if (aHasUnviewed && !bHasUnviewed) return -1;
    if (!aHasUnviewed && bHasUnviewed) return 1;
    const aLatest = Math.max(
      ...(a.stories || []).map((s) => new Date(s.createdAt).getTime()),
      0
    );
    const bLatest = Math.max(
      ...(b.stories || []).map((s) => new Date(s.createdAt).getTime()),
      0
    );
    return bLatest - aLatest;
  });
};
