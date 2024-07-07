{
  description = "gridbugs.org dev environment";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    rust-overlay.url = "github:oxalica/rust-overlay";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs, rust-overlay, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };
        rustPlatform = pkgs.makeRustPlatform {
          rustc = pkgs.rust-bin.stable.latest.default;
          cargo = pkgs.rust-bin.stable.latest.default;
        };
        zola = rustPlatform.buildRustPackage rec {
          pname = "zola";
          version = "0.19.1";
          src = pkgs.fetchFromGitHub {
            owner = "getzola";
            repo = "zola";
            rev = "v${version}";
            hash =  "sha256-qvePWGTosOTWsuwcFeOVZ7MePFpMPkC3eosIgjlPRyY=";
          };

          cargoSha256 = "sha256-Q2Zx00Gf89TJcsOFqkq0b4e96clv/CLQE51gGONZZl0=";

          nativeBuildInputs = [
            pkgs.pkg-config
          ] ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
            pkgs.darwin.apple_sdk.frameworks.CoreServices
            pkgs.darwin.apple_sdk.frameworks.SystemConfiguration
          ];

          buildInputs = [
            pkgs.openssl
            pkgs.zlib
          ] ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
            pkgs.darwin.apple_sdk.frameworks.CoreServices
            pkgs.darwin.apple_sdk.frameworks.SystemConfiguration
          ];
        };
      in
        with pkgs;
        {
          devShell = mkShell {
            buildInputs = [
              zola
              ffmpeg
              imagemagick
            ];
          };
        }
    );
}
