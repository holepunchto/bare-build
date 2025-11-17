cmake_minimum_required(VERSION 4.0)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)
find_package(cmake-fetch REQUIRED PATHS node_modules/cmake-fetch)

project(bare_build C)

set(bare_version "1.24.3")

fetch_package("github:holepunchto/bare@${bare_version}")
fetch_package("github:holepunchto/libpath")

add_executable(bare_build)

target_sources(
  bare_build
  PRIVATE
    lib/runtime.c
)

if(APPLE)
  set(bare_build_rpath "@loader_path/../Frameworks")
elseif(LINUX)
  set(bare_build_rpath "$ORIGIN/../lib")
else()
  set(${target}_rpath "")
endif()

set_target_properties(
  bare_build
  PROPERTIES
  OUTPUT_NAME bare

  INSTALL_RPATH "${bare_build_rpath}"
  BUILD_WITH_INSTALL_RPATH ON

  ENABLE_EXPORTS ON
  WINDOWS_EXPORT_ALL_SYMBOLS ON
)

target_link_libraries(
  bare_build
  PUBLIC
    $<LINK_LIBRARY:WHOLE_ARCHIVE,bare_static>
  PRIVATE
    log_static
    rlimit_static
    path_static
)

if(WIN32)
  file(READ "lib/runtime.manifest" manifest)

  string(CONFIGURE "${manifest}" manifest)

  file(GENERATE OUTPUT "runtime.manifest" CONTENT "${manifest}" NEWLINE_STYLE WIN32)

  target_sources(
    ${target}
    PRIVATE
      "${CMAKE_CURRENT_BINARY_DIR}/runtime.manifest"
  )

  target_link_options(
    bare_build
    PRIVATE
      $<$<CONFIG:Release>:/subsystem:windows /entry:mainCRTStartup>
  )
endif()

bare_target(target)

install(TARGETS bare_build DESTINATION ${target})
