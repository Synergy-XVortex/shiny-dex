#!/usr/bin/env bash
# Downloads the PokéAPI inputs of the import into .cache/pokeapi (git-ignored):
# - the CSV tables of PokeAPI/pokeapi needed by build-reference.ts;
# - the list of HOME sprite files in PokeAPI/sprites (names only, no images).
# Both come from GitHub, so no access to pokeapi.co is needed.
set -euo pipefail

CACHE_DIR="$(cd "$(dirname "$0")/../.." && pwd)/.cache/pokeapi"
CSV_FILES=(
  pokemon_species.csv pokemon_species_names.csv pokemon.csv pokemon_forms.csv
  pokemon_form_names.csv pokemon_types.csv types.csv
)

mkdir -p "$CACHE_DIR"
cd "$CACHE_DIR"

if [ ! -d api/.git ]; then
  git clone --quiet --depth 1 --filter=blob:none --no-checkout https://github.com/PokeAPI/pokeapi.git api
fi
git -C api fetch --quiet --depth 1 origin HEAD
git -C api sparse-checkout set --no-cone "${CSV_FILES[@]/#/data/v2/csv/}"
git -C api checkout --quiet FETCH_HEAD

if [ ! -d sprites/.git ]; then
  git clone --quiet --depth 1 --filter=blob:none --no-checkout https://github.com/PokeAPI/sprites.git sprites
fi
git -C sprites fetch --quiet --depth 1 origin HEAD
git -C sprites ls-tree -r FETCH_HEAD --name-only sprites/pokemon/other/home > home-files.txt

echo "PokéAPI data ready in $CACHE_DIR ($(wc -l < home-files.txt) HOME sprite files listed)."
