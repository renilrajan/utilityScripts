
version_word = input("Enter version word (e.g: )").strip()

path_version =version_word.replace("-", "", 1)

words = [
    f'test "{version_word}"',
    f'test2 "{version_word}"'
]

print("\n".join(words))