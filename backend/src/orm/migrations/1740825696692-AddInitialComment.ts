import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInitialComment1740825696692 implements MigrationInterface { 

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "comments" ( created_at,comment) VALUES 
            (NOW(), 'Идея выглядит интересно'),
            (NOW(), 'Идея фигня. Описана плохо. Ничего не понятно')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "comments" WHERE comment IN ('Идея выглядит интересно', 'Идея фигня. Описана плохо. Ничего не понятно')
        `);
    }

}
