import { useMutation, useQuery } from "@tanstack/react-query";
import PantryItemList from "~/components/PantryItemList";
import { getPantryItems, removePantryItem } from "~/services/pantry";

export default function Pantry() {
  const query = useQuery({
    queryKey: ["pantry-items"],
    queryFn: getPantryItems,
  });

  const remove = useMutation({
    mutationFn: removePantryItem,
    onSuccess: () => query.refetch(),
  });

  return (
    <div className="flex-1 flex flex-col pt-14 pb-28">
      <h1 className="text-4xl font-extrabold text-fg px-6 mb-4">My Pantry</h1>

      <PantryItemList
        items={query.data ?? []}
        showRemove
        modifyExpiry
        onRemove={(item) => remove.mutate(item.id)}
        onSetExpiry={(id, date) => console.log(id, date)}
      />
    </div>
  );
}
