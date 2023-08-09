{
  description = "Nix package of LocalAI";

  inputs.nixpkgs.url = "github:nixos/nixpkgs/release-23.05";

  outputs = { self, nixpkgs }:
    let
      forAllSystems = nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed;
    in
    rec {
      packages = forAllSystems
        (system:
          let
            pkgs = nixpkgs.legacyPackages.${system};
          in
          {
            default = pkgs.callPackage ./. { };
          }
        );
    };
}
