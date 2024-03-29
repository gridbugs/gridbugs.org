{ pkgs ? import <nixpkgs> {} }:
let
  ruby = pkgs.ruby_3_1;
  gems = pkgs.bundlerEnv {
    name = "gridbugs.org";
    version = "1";
    inherit ruby;
    gemdir = ./.;
  };
in pkgs.mkShell {
  packages = with pkgs; [
    ruby
    gems
  ];
}
