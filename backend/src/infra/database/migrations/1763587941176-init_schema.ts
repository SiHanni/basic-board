import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1763587941176 implements MigrationInterface {
    name = 'InitSchema1763587941176'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`likes\` ADD \`deletedAt\` datetime(6) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`likes\` DROP COLUMN \`deletedAt\``);
    }

}
