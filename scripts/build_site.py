"""Build the outro from the newest dated Forendors CSV, without private fields."""
import csv
import json
import re
import shutil
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERN = re.compile(r"podporovatele-metrobuscz-(\d{4}-\d{2}-\d{2})\.csv$")


def compile_supporters(root):
    candidates = []
    for folder in (root, root / 'outro'):
        for path in folder.glob('podporovatele-metrobuscz-*.csv'):
            match = PATTERN.fullmatch(path.name)
            if match:
                candidates.append((date.fromisoformat(match[1]), path))
    if not candidates:
        raise ValueError('Chybí export podporovatele-metrobuscz-RRRR-MM-DD.csv')
    newest = max(day for day, _ in candidates)
    selected = [path for day, path in candidates if day == newest]
    if len(selected) != 1:
        raise ValueError('Dva exporty se stejným nejnovějším datem; ponechte jen jeden.')
    source = selected[0]
    with source.open(encoding='utf-8-sig', newline='') as stream:
        reader = csv.DictReader(stream)
        if not {'Jméno', 'Handle', 'Předplatné'} <= set(reader.fieldnames or []):
            raise ValueError('Export nemá sloupce Jméno, Handle, Předplatné')
        supporters = []
        for row in reader:
            tier = row['Předplatné'].strip().lower()
            name = row['Jméno'].strip() or row['Handle'].strip()
            if not name:
                raise ValueError('Podporovatel nemá jméno ani přezdívku')
            if tier not in {'standard', 'midibus'}:
                raise ValueError(f'Neznámé předplatné: {tier}')
            supporters.append({'name': name, 'tier': tier})
    supporters.sort(key=lambda row: row['tier'] != 'standard')
    return {'source': source.name, 'date': newest.isoformat(), 'supporters': supporters}


def build(root=ROOT):
    data = compile_supporters(root)
    output = root / '_site'
    if output.exists():
        shutil.rmtree(output)
    output.mkdir()
    # Publish site assets; CSV exports stay outside the Pages deployment.
    shutil.copytree(root / 'outro', output / 'outro',
                    ignore=shutil.ignore_patterns('*.csv'))
    # Easter-egg lines are public content, so retain that one CSV.
    shutil.copy2(root / 'outro/easteregg.csv', output / 'outro/easteregg.csv')
    (output / 'outro/supporters.json').write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    # Chat demo is static and contains no provider credentials or runtime data.
    if (root / 'chat').is_dir():
        shutil.copytree(root / 'chat', output / 'chat',
                        ignore=shutil.ignore_patterns('README.md'))
    for folder in ('control', 'shared', 'info', 'countdown'):
        shutil.copytree(root / folder, output / folder)
    for name in ('index.html', 'STUDIO.md'):
        shutil.copy2(root / name, output / name)
    (output / '.nojekyll').touch()
    print(f"Built {data['source']}: {len(data['supporters'])} supporters")
    return data


if __name__ == '__main__':
    build()
