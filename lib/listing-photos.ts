/** Stock photos in `public/listings/listing-1.png` … `listing-12.png`. */
export const LISTING_FALLBACK_IMAGE_COUNT = 12;

export function listingFallbackPhotoUrl(listingId: number): string {
  const index = ((listingId - 1) % LISTING_FALLBACK_IMAGE_COUNT) + 1;
  return `/listings/listing-${index}.png`;
}

export function resolveListingPhotoUrl(
  listingId: number,
  photoUrl: string | null | undefined,
): string {
  const trimmed = photoUrl?.trim();
  return trimmed ? trimmed : listingFallbackPhotoUrl(listingId);
}
