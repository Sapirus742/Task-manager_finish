import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInitialUser1740845651403 implements MigrationInterface {
    name = 'AddInitialUser1740845651403'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "user" (email, "passwordHash", firstname, lastname, "group", telephone, roles, status, competence, "teamId") VALUES 
            ('admin', '$2b$05$soYIZBdIb9MUmZAa.ThuZeX0AlA42pT8PizmVGfOCqvHuEmxDiujW', 'Super', 'Admin', 'АСОиУб-24-1', '70000000000', '{admin}', 'active', '{TypeScript}', NULL),
            ('user', '$2a$12$X3bxIlqJllFRTFbxRyMmg.vXOGhkPSwIIBLfao5d1RNZGhvcxml4i', 'Common', 'User', 'АСОиУб-24-1', '71111111111', '{user}', 'active', '{HTML}', NULL),
            ('robert@example.com', '$2b$05$soYIZBdIb9MUmZAa.ThuZeX0AlA42pT8PizmVGfOCqvHuEmxDiujW', 'Robert', 'Wilson', 'ИСПб-24-1', '79225684392', '{admin}', 'active', '{TypeScript}', NULL),
            ('daniel@example.com', '$2b$05$soYIZBdIb9MUmZAa.ThuZeX0AlA42pT8PizmVGfOCqvHuEmxDiujW', 'Daniel', 'Williams', 'ИБКСб-24-1', '79225275801', '{user}', 'pending', '{HTML}', NULL),
            ('john@example.com', '$2b$05$soYIZBdIb9MUmZAa.ThuZeX0AlA42pT8PizmVGfOCqvHuEmxDiujW', 'John', 'Thomas', 'АСОиУб-24-1', '79220848224', '{customer}', 'inactive', '{PostgreSQL}', NULL),
            ('william@example.com', '$2b$05$soYIZBdIb9MUmZAa.ThuZeX0AlA42pT8PizmVGfOCqvHuEmxDiujW', 'William', 'Ross', 'РППб-24-1', '79224416809', '{expert}', 'inactive', '{PostgreSQL}', NULL),
            ('scott@example.com', '$2b$05$soYIZBdIb9MUmZAa.ThuZeX0AlA42pT8PizmVGfOCqvHuEmxDiujW', 'Scott', 'Ortiz', 'ПКТб-24-1', '79227870709', '{directorate}', 'active', '{TypeScript}', NULL),
            ('albert@example.com', '$2b$05$soYIZBdIb9MUmZAa.ThuZeX0AlA42pT8PizmVGfOCqvHuEmxDiujW', 'Albert', 'Comandowich', 'АСОиУб-24-1', '79223456789', '{user}', 'active', '{HTML}', NULL),
            ('billy@example.com', '$2b$05$soYIZBdIb9MUmZAa.ThuZeX0AlA42pT8PizmVGfOCqvHuEmxDiujW', 'Billy', 'Comandowich', 'АСОиУб-24-1', '79223456788', '{user}', 'active', '{TypeScript}', NULL),
            ('candy@example.com', '$2b$05$soYIZBdIb9MUmZAa.ThuZeX0AlA42pT8PizmVGfOCqvHuEmxDiujW', 'Candy', 'Comandowich', 'АСОиУб-24-1', '79223456787', '{user}', 'active', '{Java}', NULL),
            ('drilly@example.com', '$2b$05$soYIZBdIb9MUmZAa.ThuZeX0AlA42pT8PizmVGfOCqvHuEmxDiujW', 'Drilly', 'Comandowich', 'АСОиУб-24-1', '79223456786', '{user}', 'active', '{JavaScript}', NULL),
            ('emily@example.com', '$2b$05$soYIZBdIb9MUmZAa.ThuZeX0AlA42pT8PizmVGfOCqvHuEmxDiujW', 'Emily', 'Comandowich', 'АСОиУб-24-1', '79223456785', '{user}', 'active', '{Yoptascript}', NULL);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "user" WHERE email IN ('robert@example.com', 'daniel@example.com', 'john@example.com', 'william@example.com', 'scott@example.com')
        `);
    }

}
