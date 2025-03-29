import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInitialTeams1740845193243 implements MigrationInterface {
    name = 'AddInitialTeams1740845193243'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "team" WHERE name IN ('Team Alpha', 'Team Beta')
        `);
    }
}
