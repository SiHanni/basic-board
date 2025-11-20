import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1763595727352 implements MigrationInterface {
    name = 'InitSchema1763595727352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`post_likes\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`postId\` varchar(255) NOT NULL, \`reaction\` varchar(10) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`uq_post_likes_user_post\` (\`userId\`, \`postId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`posts\` ADD \`dislikeCount\` int UNSIGNED NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`post_likes\` ADD CONSTRAINT \`FK_37d337ad54b1aa6b9a44415a498\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`post_likes\` ADD CONSTRAINT \`FK_6999d13aca25e33515210abaf16\` FOREIGN KEY (\`postId\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`post_likes\` DROP FOREIGN KEY \`FK_6999d13aca25e33515210abaf16\``);
        await queryRunner.query(`ALTER TABLE \`post_likes\` DROP FOREIGN KEY \`FK_37d337ad54b1aa6b9a44415a498\``);
        await queryRunner.query(`ALTER TABLE \`posts\` DROP COLUMN \`dislikeCount\``);
        await queryRunner.query(`DROP INDEX \`uq_post_likes_user_post\` ON \`post_likes\``);
        await queryRunner.query(`DROP TABLE \`post_likes\``);
    }

}
