import { exiftool } from 'exiftool-vendored';
import dotenv from 'dotenv';
import path from 'node:path';
import { glob } from 'glob';
import { parse } from 'date-fns';
import fs from 'node:fs/promises';

dotenv.config();

async function main() {
    const workingDirectory = process.env.WORKING_DIRECTORY + '';
    const files = await glob(
        path.join(workingDirectory, '**/IMG-*-WA*.{jpg, jpeg}'),
    );

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const tags = await exiftool.read(file);
        if (tags.CreateDate) {
            console.log(`${file} has CreateDate, skipping...`);
            continue;
        } else if (tags.DateTimeOriginal) {
            console.log(`${file} has DateTimeOriginal, set it to CreateDate`);
            await exiftool.write(file, {
                CreateDate: tags.DateTimeOriginal,
                ModifyDate: new Date().toISOString(),
            });
        } else {
            console.log(`${file} has no exif date, set it with the file name`);
            const segments = file.split('/');
            const dateString = segments[segments.length - 1].split('-')[1];
            const date = parse(dateString, 'yyyyMMdd', new Date());
            await exiftool.write(file, {
                CreateDate: date.toISOString(),
                DateTimeOriginal: date.toISOString(),
                ModifyDate: new Date().toISOString(),
            });
        }
        const originalFile = file.replace('.jpg', '.jpg_original');
        console.log(`Removing original file ${originalFile}`);
        await fs.rm(originalFile);
    }
    await exiftool.end(true);
}

main();
