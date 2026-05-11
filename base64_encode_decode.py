import base64

def encode_data():
    text = input("\nEnter the text to encode: ")
    # Convert text to bytes, then encode, then back to string for display
    encoded_bytes = base64.b64encode(text.encode("utf-8"))
    print(f"Result: {encoded_bytes.decode('utf-8')}")

def decode_data():
    encoded_text = input("\nEnter the Base64 data to decode: ")
    try:
        # Convert string to bytes, decode, then back to utf-8 string
        decoded_bytes = base64.b64decode(encoded_text)
        print(f"Result: {decoded_bytes.decode('utf-8')}")
    except Exception as e:
        print(f"Error: Invalid Base64 data. ({e})")

def main():
    while True:
        print("\n--- Developer Toolkit: Base64 ---")
        print("1. Encode text to Base64")
        print("2. Decode Base64 to text")
        print("3. Exit")
        
        choice = input("Select an option (1-3): ")

        if choice == '1':
            encode_data()
        elif choice == '2':
            decode_data()
        elif choice == '3':
            print("Exiting...")
            break
        else:
            print("Invalid choice, please try again.")

if __name__ == "__main__":
    main()