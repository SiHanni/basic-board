import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1763598249362 implements MigrationInterface {
    name = 'InitSchema1763598249362'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`comment_likes\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`commentId\` varchar(255) NOT NULL, \`reaction\` varchar(10) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`uq_comment_likes_user_comment\` (\`userId\`, \`commentId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`comments\` ADD \`likeCount\` int UNSIGNED NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`comments\` ADD \`dislikeCount\` int UNSIGNED NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`comment_likes\` ADD CONSTRAINT \`FK_34d1f902a8a527dbc2502f87c88\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`comment_likes\` ADD CONSTRAINT \`FK_abbd506a94a424dd6a3a68d26f4\` FOREIGN KEY (\`commentId\`) REFERENCES \`comments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`comment_likes\` DROP FOREIGN KEY \`FK_abbd506a94a424dd6a3a68d26f4\``);
        await queryRunner.query(`ALTER TABLE \`comment_likes\` DROP FOREIGN KEY \`FK_34d1f902a8a527dbc2502f87c88\``);
        await queryRunner.query(`ALTER TABLE \`comments\` DROP COLUMN \`dislikeCount\``);
        await queryRunner.query(`ALTER TABLE \`comments\` DROP COLUMN \`likeCount\``);
        await queryRunner.query(`DROP INDEX \`uq_comment_likes_user_comment\` ON \`comment_likes\``);
        await queryRunner.query(`DROP TABLE \`comment_likes\``);
    }

}
