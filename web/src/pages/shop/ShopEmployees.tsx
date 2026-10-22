import { useState } from 'react';
import { demoEmployees, demoRoles } from '../../lib/demo';
import type { Employee } from '../../lib/types';
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHead,
  Section,
  Select,
  TabStrip,
} from '../../components/ui';

const ROLE_KEYS = ['SHOP_OWNER', 'MANAGER', 'CASHIER', 'INVENTORY_MANAGER', 'GROOMER', 'BOARDING_STAFF'];

// Capability rows for the permission matrix (customer-friendly labels mapped to
// the backend permission domains).
const CAPABILITIES = [
  { label: 'Assigned appointments', key: 'appointments' },
  { label: 'Pet care instructions', key: 'care' },
  { label: 'Care task completion', key: 'careComplete' },
  { label: 'POS & receipts', key: 'pos' },
  { label: 'Inventory & stock', key: 'inventory' },
  { label: 'Refund authorisation', key: 'refund' },
  { label: 'Finance / reports', key: 'finance' },
  { label: 'Employees & access', key: 'employees' },
];

type Access = 'Manage' | 'View' | 'View / update' | 'Assigned' | 'Allowed' | '—';

// Role → capability → access level, mirroring DEFAULT_ROLES in the backend.
const MATRIX: Record<string, Record<string, Access>> = {
  SHOP_OWNER: {
    appointments: 'Manage', care: 'Manage', careComplete: 'Manage', pos: 'Allowed',
    inventory: 'Manage', refund: 'Allowed', finance: 'Allowed', employees: 'Manage',
  },
  MANAGER: {
    appointments: 'Manage', care: 'View', careComplete: 'Manage', pos: 'Allowed',
    inventory: 'View', refund: '—', finance: 'View', employees: 'View',
  },
  CASHIER: {
    appointments: '—', care: '—', careComplete: '—', pos: 'Allowed',
    inventory: 'View', refund: '—', finance: '—', employees: '—',
  },
  INVENTORY_MANAGER: {
    appointments: '—', care: '—', careComplete: '—', pos: '—',
    inventory: 'Manage', refund: '—', finance: '—', employees: '—',
  },
  GROOMER: {
    appointments: 'View / update', care: 'Assigned', careComplete: '—', pos: '—',
    inventory: '—', refund: '—', finance: '—', employees: '—',
  },
  BOARDING_STAFF: {
    appointments: '—', care: 'Assigned', careComplete: 'Assigned', pos: '—',
    inventory: '—', refund: '—', finance: '—', employees: '—',
  },
};

const TABS = ['Team', 'Roles & permissions'];

function accessTone(a: Access): string {
  if (a === 'Manage' || a === 'Allowed') return 'green';
  if (a === 'View' || a === 'Assigned' || a === 'View / update') return 'amber';
  return 'slate';
}

/**
 * Shop Admin employees, roles & user rights (Figma 15 "The right access for
 * every role"). Team management + a read-through permission matrix per role.
 * Wires to /my-shop/employees and /my-shop/roles (demo fallback).
 */
export function ShopEmployees() {
  const [tab, setTab] = useState(TABS[0]);
  const [employees, setEmployees] = useState<Employee[]>(demoEmployees);
  const [selectedRole, setSelectedRole] = useState('GROOMER');
  const [form, setForm] = useState({ fullName: '', username: '', email: '', roleKey: 'CASHIER', branch: 'Indiranagar' });

  function addEmployee() {
    if (!form.fullName || !form.username) return;
    const role = demoRoles.find((r) => r.key === form.roleKey) ?? demoRoles[2];
    setEmployees((es) => [
      ...es,
      { id: `e_${Date.now()}`, username: form.username, fullName: form.fullName, isActive: true, role },
    ]);
    setForm({ fullName: '', username: '', email: '', roleKey: 'CASHIER', branch: 'Indiranagar' });
  }

  function toggleActive(id: string) {
    setEmployees((es) => es.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e)));
  }

  return (
    <div>
      <PageHead
        eyebrow={['MILO & MAPLE', 'EMPLOYEES']}
        title="The right access for every role."
        subtitle="Individual accounts, branch-scoped permissions and a clear trail of changes."
      />

      <TabStrip tabs={TABS} active={tab} onSelect={setTab} />

      {tab === 'Team' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <Section title={<span>Your team <span className="text-sm font-normal text-slate-400">· Indiranagar</span></span>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-300 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 font-semibold">Employee</th>
                    <th className="pb-2 font-semibold">Role</th>
                    <th className="pb-2 font-semibold">Account</th>
                    <th className="pb-2 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.id} className="border-b border-cream-200 last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-slate-800">{e.fullName}</p>
                        <p className="text-xs text-slate-400">{e.username}</p>
                      </td>
                      <td className="py-3">
                        <Badge tone="clay">{e.role?.key.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-3">
                        <Badge tone={e.isActive ? 'green' : 'red'}>{e.isActive ? 'Active' : 'Deactivated'}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="link" onClick={() => toggleActive(e.id)}>
                          {e.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Usernames are unique to individual staff. Shared owner credentials are not used.
            </p>
          </Section>

          <Section title="Create an employee">
            <div className="space-y-4">
              <Field label="Full name">
                <Input value={form.fullName} placeholder="Neha Shah" onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </Field>
              <Field label="Individual username">
                <Input value={form.username} placeholder="neha.shah" onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </Field>
              <Field label="Email or mobile">
                <Input value={form.email} placeholder="neha@example.in" onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Role">
                <Select value={form.roleKey} onChange={(e) => setForm({ ...form, roleKey: e.target.value })}>
                  {ROLE_KEYS.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, ' ')}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Branch assignment">
                <Select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                  <option>Indiranagar only</option>
                  <option>All branches</option>
                </Select>
              </Field>
              <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
                <p className="font-semibold">Secure initial access</p>
                <p className="mt-0.5">Send a one-time invitation to set a password. Stored passwords are never displayed.</p>
              </div>
              <Button className="w-full" onClick={addEmployee}>
                Send access invitation
              </Button>
            </div>
          </Section>
        </div>
      )}

      {tab === 'Roles & permissions' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Permission matrix</h2>
              <span className="text-sm text-slate-500">
                Selected role: <span className="font-medium text-slate-700">{selectedRole.replace(/_/g, ' ')}</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-300 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 font-semibold">Capability</th>
                    {ROLE_KEYS.map((r) => (
                      <th
                        key={r}
                        className={`px-2 pb-2 text-center font-semibold ${r === selectedRole ? 'text-brand-700' : ''}`}
                      >
                        {r.replace(/_/g, ' ').replace('SHOP ', '')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CAPABILITIES.map((cap) => (
                    <tr key={cap.key} className="border-b border-cream-200 last:border-0">
                      <td className="py-2.5 font-medium text-slate-700">{cap.label}</td>
                      {ROLE_KEYS.map((r) => {
                        const val = MATRIX[r][cap.key] ?? '—';
                        return (
                          <td key={r} className={`px-2 py-2.5 text-center ${r === selectedRole ? 'bg-brand-50/60' : ''}`}>
                            {val === '—' ? (
                              <span className="text-slate-300">—</span>
                            ) : (
                              <Badge tone={accessTone(val)}>{val}</Badge>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
              <p className="font-semibold">Enforced beyond the menu</p>
              <p className="mt-0.5">
                Branch and role permissions are checked for every action. Hiding a menu is not an
                authorisation boundary.
              </p>
            </div>
          </Card>

          <Section title="Roles">
            <p className="mb-3 text-sm text-slate-500">Select a role to highlight its access.</p>
            <div className="space-y-2">
              {ROLE_KEYS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    r === selectedRole
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-cream-300 bg-white text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {r.replace(/_/g, ' ')}
                  {r === 'SHOP_OWNER' && <span className="text-xs text-slate-400">Full access</span>}
                </button>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
