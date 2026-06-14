import { ReviewStreamClient } from "../../../src/components/review-stream-client";

export default function ReviewPage({ params }: { params: { id: string } }) {
  return <ReviewStreamClient reviewId={params.id} />;
}
