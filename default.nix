{ mkYarnPackage
, python3
}:
mkYarnPackage {
  pname = "graphwork";
  version = "2022-09-04";
  src = ./.;
  distPhase = ":";

  nativeBuildInputs = [
    python3
  ];
}
