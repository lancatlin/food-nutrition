import PantryItemList from "~/components/PantryItemList";

export default function Pantry() {
  return (
    <div className="flex-1 flex flex-col pt-14 pb-28">
      <h1 className="text-4xl font-extrabold text-fg px-6 mb-4">My Pantry</h1>

      <PantryItemList showRemove modifyExpiry />
    </div>
  );
}
