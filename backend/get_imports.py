import sys
import struct

def get_imported_dlls(filepath):
    with open(filepath, 'rb') as f:
        # Check DOS header
        dos_header = f.read(64)
        if dos_header[:2] != b'MZ':
            print("Not a valid PE file")
            return
        
        # Read e_lfanew
        e_lfanew, = struct.unpack('<I', dos_header[60:64])
        
        # Go to PE header
        f.seek(e_lfanew)
        pe_signature = f.read(4)
        if pe_signature != b'PE\0\0':
            print("Not a valid PE file (missing PE signature)")
            return
            
        # File header
        file_header = f.read(20)
        
        # Optional header
        magic = f.read(2)
        if magic == b'\x0b\x01':
            # PE32
            data_dir_offset = e_lfanew + 24 + 96
        elif magic == b'\x0b\x02':
            # PE32+
            data_dir_offset = e_lfanew + 24 + 112
        else:
            print("Unknown PE magic")
            return
            
        # Read Import Table Directory Entry (it's the 2nd entry, index 1)
        f.seek(data_dir_offset + 8) # 8 bytes per directory entry
        import_rva, import_size = struct.unpack('<II', f.read(8))
        
        if import_rva == 0:
            print("No import table found")
            return
            
        # We need to map RVA to File Offset. To do this we read sections
        f.seek(e_lfanew + 6)
        num_sections, = struct.unpack('<H', f.read(2))
        
        size_of_optional_header, = struct.unpack('<H', file_header[16:18])
        section_table_offset = e_lfanew + 24 + size_of_optional_header
        
        sections = []
        f.seek(section_table_offset)
        for i in range(num_sections):
            section_data = f.read(40)
            name = section_data[:8].strip(b'\0').decode('utf-8', 'ignore')
            v_size, v_addr, r_size, r_addr = struct.unpack('<IIII', section_data[8:24])
            sections.append((v_addr, v_size, r_addr, r_size, name))
            
        def rva_to_offset(rva):
            for v_addr, v_size, r_addr, r_size, name in sections:
                if v_addr <= rva < v_addr + v_size:
                    return r_addr + (rva - v_addr)
            return None
            
        import_offset = rva_to_offset(import_rva)
        if not import_offset:
            print("Could not map import RVA")
            return
            
        f.seek(import_offset)
        dlls = []
        while True:
            # IMAGE_IMPORT_DESCRIPTOR is 20 bytes
            import_desc = f.read(20)
            if import_desc == b'\0' * 20:
                break
            # Name RVA is at offset 12
            name_rva, = struct.unpack('<I', import_desc[12:16])
            name_offset = rva_to_offset(name_rva)
            
            # Save current position
            current_pos = f.tell()
            
            # Read DLL name
            f.seek(name_offset)
            dll_name = b''
            while True:
                c = f.read(1)
                if c == b'\0':
                    break
                dll_name += c
            dlls.append(dll_name.decode('utf-8', 'ignore'))
            
            # Restore position
            f.seek(current_pos)
            
        print("Imported DLLs:")
        for dll in dlls:
            print(f"- {dll}")

if __name__ == '__main__':
    get_imported_dlls(sys.argv[1])
