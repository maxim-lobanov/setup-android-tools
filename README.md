# setup-android-tools
This action is intended to install Android tools on Hosted images in GitHub Actions.  
It wraps `sdkmanager` and automate [caching](https://docs.github.com/en/actions/configuring-and-managing-workflows/caching-dependencies-to-speed-up-workflows) of installed packages.

### Available parameters
|Parameter|Description|
|-|-|
|`packages`|Specify the package or list of packages to install [Mandatory parameter]If package is already installed, and update is available, action will update it|
|`cache`|Enable to cache installed packages (see details below)(`true` or `false`)(`false` by default)| 

### Usage
Install the single package:
```
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: setup-android-tools
      uses: maxim-lobanov/setup-android-tools@1.0
      with:
        packages: ndk;19.2.5345600
```

Install multiple packages:
```
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: maxim-lobanov/setup-android-tools@1.0
      with:
        packages: |
          platforms;android-29
          platforms;android-30
          system-images;android-30;google_apis;x86
```

Install package with enabled cache:
```
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: maxim-lobanov/setup-android-tools@1.0
      with:
        packages: ndk;19.2.5345600
        cache: true
```

### Cache packages
With `cache: true`, action will automatically cache all downloaded packages via [@actions/cache](https://github.com/actions/toolkit/tree/main/packages/cache). In some cases, it could significantly speed up your builds.  
> Note that GitHub will remove any cache entries that have not been accessed in over 7 days. There is no limit on the number of caches you can store, but the total size of all caches in a repository is limited to 5 GB. If you exceed this limit, GitHub will save your cache but will begin evicting caches until the total size is less than 5 GB.

See "[Caching dependencies to speed up workflows](https://help.github.com/github/automating-your-workflow-with-github-actions/caching-dependencies-to-speed-up-workflows)" for how caching works.


### License
The scripts and documentation in this project are released under the [MIT License](LICENSE)