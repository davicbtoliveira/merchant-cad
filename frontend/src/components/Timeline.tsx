import { Spinner } from "../ui/Spinner";
import { useTimeline } from "../hooks/useMerchants";
import { formatDateTime } from "../utils/date";

interface MerchantTimelineProps {
  merchantId: number;
}

export function MerchantTimeline({ merchantId }: MerchantTimelineProps) {
  const { data: events, isLoading } = useTimeline(merchantId);

  if (isLoading) {
    return <Spinner size="md" />;
  }

  if (!events || events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
        <p className="text-sm text-gray-500">
          Nenhum evento registrado. Merchant recém-criado.
        </p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, index) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {index < events.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex gap-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
                  <span className="text-xs text-gray-500">●</span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between gap-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-900">{event.message}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-500">
                      {formatDateTime(event.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
