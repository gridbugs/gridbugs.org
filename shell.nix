{ pkgs ? import <nixpkgs> {} }:
  pkgs.mkShell {
    nativeBuildInputs = [
      pkgs.buildPackages.ruby_3_0
      pkgs.buildPackages.openssl
    ];
  }
