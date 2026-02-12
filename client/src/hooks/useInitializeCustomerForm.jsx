import { useEffect } from "react";

export default function useInitializeCustomerForm(data, setForm) {
  return useEffect(() => {
    if (data && data.length > 0) {
      setForm((prev) => ({
        ...prev,
        name: data[0].name || "",
        contact_no: data[0].contact_no || "",
        email: data[0].email || "",
        emergency_contact_name: data[0].emergency_contact_name || "",
        emergency_contact_no: data[0].emergency_contact_no || "",
        dateOfBirth: data[0].dateOfBirth ? new Date(data[0].dateOfBirth).toISOString().split("T")[0] : "",
        address: data[0].address || "",
        country: data[0].country || "",
        postalcode: data[0].postalcode || "",
        referred_by: data[0].referred_by || "",
        referred_other: data[0].referred_other || "",
      }));
    }
  }, [data]);
}
