# thebuilder

This is a command-line tool for building projects that use `git`, `cmake`, and `ninja`.
It requires the use of these three build tools:

    * The project must use `git` for its source code control system.
    * The project must use `CMake` to specify the projects components and build targets.
    * The project must use `Ninja` for running builds. It certainly could be possible to
      add an option to `Make` instead, but we choose not to.

The primary use case is C/C++ projects that need multiple build configurations. The
the tool doesn't require the use of C/C++, but it seems unlikely that it will ever be
used for anything else.

More info TBD.
