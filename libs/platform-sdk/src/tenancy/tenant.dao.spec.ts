import { Repository } from 'typeorm';
import { StatusForEntityEnum } from './status-for-entity.enum';
import { TenantDao } from './tenant.dao';

type Row = { id: string; accountId: string; status?: StatusForEntityEnum };
class RowDao extends TenantDao<Row> {
  constructor(repository: Repository<Row>) {
    super(repository);
  }
}

describe('TenantDao', () => {
  const repository = {
    findOne: jest.fn(async () => null),
    update: jest.fn(async () => ({ affected: 1 })),
  } as unknown as Repository<Row>;
  const dao = new RowDao(repository);

  it('toda lectura va acotada a la cuenta y excluye lo borrado', async () => {
    await dao.findById('a1', 'r1');
    const where = (repository.findOne as jest.Mock).mock.calls[0][0].where;
    expect(where).toMatchObject({ id: 'r1', accountId: 'a1' });
    expect(where.status).toBeDefined();
  });

  it('borrar es soft delete dentro de la cuenta', async () => {
    await expect(dao.softDelete('a1', 'r1')).resolves.toBe(true);
    expect(repository.update).toHaveBeenCalledWith({ id: 'r1', accountId: 'a1' }, { status: StatusForEntityEnum.Deleted });
  });
});
