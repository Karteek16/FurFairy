import { useState } from 'react';
import { demoPets } from '../../lib/demo';
import type { Pet } from '../../lib/types';
import { Badge, Button, Card, Field, Input, Select } from '../../components/ui';

export function CustomerPets() {
  const [pets, setPets] = useState<Pet[]>(demoPets);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', species: 'DOG', breed: '', sizeClass: 'MEDIUM' });

  function addPet(e: React.FormEvent) {
    e.preventDefault();
    setPets((p) => [...p, { id: `pet_${Date.now()}`, ...form }]);
    setForm({ name: '', species: 'DOG', breed: '', sizeClass: 'MEDIUM' });
    setAdding(false);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Pets</h1>
          <p className="text-slate-500">Manage your pet profiles and records.</p>
        </div>
        <Button onClick={() => setAdding((a) => !a)}>{adding ? 'Close' : '+ Add pet'}</Button>
      </div>

      {adding && (
        <Card className="mb-6">
          <form onSubmit={addPet} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Species">
              <Select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>
                <option>DOG</option>
                <option>CAT</option>
                <option>BIRD</option>
                <option>OTHER</option>
              </Select>
            </Field>
            <Field label="Breed">
              <Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
            </Field>
            <Field label="Size">
              <Select value={form.sizeClass} onChange={(e) => setForm({ ...form, sizeClass: e.target.value })}>
                <option>SMALL</option>
                <option>MEDIUM</option>
                <option>LARGE</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Save pet</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <Card key={pet.id}>
            <div className="mb-2 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-xl">
                {pet.species === 'CAT' ? '🐱' : pet.species === 'DOG' ? '🐶' : '🐾'}
              </span>
              <div>
                <p className="font-semibold text-slate-800">{pet.name}</p>
                <p className="text-xs text-slate-400">{pet.breed || pet.species}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Badge>{pet.species}</Badge>
              {pet.sizeClass && <Badge tone="blue">{pet.sizeClass}</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
