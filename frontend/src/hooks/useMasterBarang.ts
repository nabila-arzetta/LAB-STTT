import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMasterBarang, createMasterBarang, updateMasterBarang, deleteMasterBarang } from "@/services/masterBarang.service";

export function useMasterBarang() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["master-barang"], queryFn: () => listMasterBarang().then(r=>r.data) });

  const createMut = useMutation({
    mutationFn: createMasterBarang,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["master-barang"] }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id:number; data:any }) => updateMasterBarang(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["master-barang"] }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteMasterBarang,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["master-barang"] }),
  });

  return { ...q, createMut, updateMut, deleteMut };
}
