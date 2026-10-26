import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SINGPASS_ENABLED, singpassService } from "@/services/singpassService";

// Admin-only list of linked Singpass accounts with revoke. The server checks the
// Admin role from the database; for anyone else the request fails and nothing renders.
export default function SingpassLinksPanel() {
  const [links, setLinks] = useState(null);

  const load = () =>
    singpassService
      .listLinks()
      .then(setLinks)
      .catch(() => setLinks(null));

  useEffect(() => {
    if (SINGPASS_ENABLED) load();
  }, []);

  if (!SINGPASS_ENABLED || links === null) return null;

  const revoke = async (link) => {
    if (!window.confirm(`Revoke Singpass login for ${link.username || link.email}?`)) return;
    try {
      await singpassService.revokeLink(link.id);
      toast.success("Singpass link revoked");
      load();
    } catch {
      toast.error("Could not revoke Singpass link");
    }
  };

  return (
    <div className='mt-10'>
      <h2 className='text-lg font-bold mb-2'>Singpass links</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Linked</TableHead>
            <TableHead>Last Singpass login</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className='text-gray-500'>
                No Singpass accounts linked.
              </TableCell>
            </TableRow>
          ) : (
            links.map((link) => (
              <TableRow key={link.id}>
                <TableCell>
                  {link.username} <span className='text-gray-500'>({link.email})</span>
                </TableCell>
                <TableCell>{link.role}</TableCell>
                <TableCell>{new Date(link.linkedAt).toLocaleString()}</TableCell>
                <TableCell>{link.lastLoginAt ? new Date(link.lastLoginAt).toLocaleString() : "—"}</TableCell>
                <TableCell>
                  <Button size='sm' variant='destructive' onClick={() => revoke(link)}>
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
