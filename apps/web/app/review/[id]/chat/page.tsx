import { ReviewChatClient } from "../../../../src/components/review-chat-client";

export default function ReviewChatPage({ params }: { params: { id: string } }) {
  return <ReviewChatClient reviewId={params.id} />;
}
