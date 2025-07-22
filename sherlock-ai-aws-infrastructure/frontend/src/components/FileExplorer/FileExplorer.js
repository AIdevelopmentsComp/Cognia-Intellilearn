import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFolder,
  FiFolderOpen,
  FiFile,
  FiDownload,
  FiEye,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiUpload,
  FiEdit3,
  FiShare2,
  FiTrash2,
  FiCalendar,
  FiUser,
  FiFileText,
  FiImage,
  FiVideo,
  FiMusic,
} from 'react-icons/fi';

const FileExplorerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${({ theme }) => theme.colors.primary.black};
`;

const ExplorerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
  background: ${({ theme }) => theme.colors.grays.darkGray};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const HeaderTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 700;
`;

const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const BreadcrumbItem = styled.button`
  background: none;
  border: none;
  color: ${({ isActive, theme }) => 
    isActive ? theme.colors.primary.yellow : theme.colors.text.secondary
  };
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.grays.mediumGray};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  &::after {
    content: '>';
    margin-left: ${({ theme }) => theme.spacing.sm};
    color: ${({ theme }) => theme.colors.text.muted};
  }

  &:last-child::after {
    content: '';
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SearchBox = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  background: ${({ theme }) => theme.colors.grays.mediumGray};
  border: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg} ${theme.spacing.sm} ${theme.spacing.xl}`};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  min-width: 300px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.yellow};
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const ViewToggle = styled.div`
  display: flex;
  background: ${({ theme }) => theme.colors.grays.mediumGray};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.xs};
`;

const ViewButton = styled.button`
  background: ${({ isActive, theme }) => 
    isActive ? theme.colors.primary.yellow : 'transparent'
  };
  color: ${({ isActive, theme }) => 
    isActive ? theme.colors.primary.black : theme.colors.text.secondary
  };
  border: none;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: ${({ isActive, theme }) => 
      isActive ? theme.colors.primary.yellowSecondary : theme.colors.grays.lightGray
    };
  }
`;

const ExplorerBody = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 300px;
  background: ${({ theme }) => theme.colors.grays.darkGray};
  border-right: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
  display: flex;
  flex-direction: column;
`;

const SidebarSection = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
`;

const SidebarTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.primary.yellow};
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  letter-spacing: 1px;
`;

const FolderTree = styled.div`
  display: flex;
  flex-direction: column;
`;

const FolderItem = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.2s ease;
  padding-left: ${({ depth = 0, theme }) => 
    `calc(${theme.spacing.md} + ${depth * 20}px)`
  };

  &:hover {
    background: ${({ theme }) => theme.colors.grays.mediumGray};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  &.active {
    background: rgba(255, 215, 0, 0.1);
    color: ${({ theme }) => theme.colors.primary.yellow};
  }

  svg {
    margin-right: ${({ theme }) => theme.spacing.sm};
    font-size: ${({ theme }) => theme.fontSizes.base};
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
  background: ${({ theme }) => theme.colors.grays.darkGray};
`;

const ContentTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ActionButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ primary, theme }) => 
    primary ? theme.colors.primary.yellow : 'transparent'
  };
  color: ${({ primary, theme }) => 
    primary ? theme.colors.primary.black : theme.colors.primary.yellow
  };
  border: ${({ primary, theme }) => 
    primary ? 'none' : `1px solid ${theme.colors.primary.yellow}`
  };
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ primary, theme }) => 
      primary ? theme.colors.primary.yellowSecondary : theme.colors.primary.yellow
    };
    color: ${({ theme }) => theme.colors.primary.black};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FileGrid = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg};
  overflow-y: auto;
  display: grid;
  grid-template-columns: ${({ viewMode }) => 
    viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr'
  };
  gap: ${({ theme }) => theme.spacing.md};
  align-content: start;
`;

const FileItem = styled(motion.div)`
  background: ${({ theme }) => theme.colors.grays.darkGray};
  border: 1px solid ${({ theme }) => theme.colors.grays.borderGray};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme, viewMode }) => 
    viewMode === 'grid' ? theme.spacing.lg : theme.spacing.md
  };
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: ${({ viewMode }) => viewMode === 'list' ? 'flex' : 'block'};
  align-items: ${({ viewMode }) => viewMode === 'list' ? 'center' : 'initial'};
  gap: ${({ viewMode, theme }) => viewMode === 'list' ? theme.spacing.md : '0'};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.yellow};
    transform: ${({ viewMode }) => viewMode === 'grid' ? 'translateY(-2px)' : 'none'};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &.selected {
    border-color: ${({ theme }) => theme.colors.primary.yellow};
    background: rgba(255, 215, 0, 0.1);
  }
`;

const FileIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ viewMode }) => viewMode === 'grid' ? '60px' : '32px'};
  height: ${({ viewMode }) => viewMode === 'grid' ? '60px' : '32px'};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ fileType, theme }) => {
    const colors = {
      folder: 'rgba(255, 215, 0, 0.2)',
      pdf: 'rgba(220, 53, 69, 0.2)',
      doc: 'rgba(0, 123, 255, 0.2)',
      image: 'rgba(40, 167, 69, 0.2)',
      video: 'rgba(108, 117, 125, 0.2)',
      default: 'rgba(255, 215, 0, 0.1)'
    };
    return colors[fileType] || colors.default;
  }};
  color: ${({ fileType, theme }) => {
    const colors = {
      folder: theme.colors.primary.yellow,
      pdf: '#dc3545',
      doc: '#007bff',
      image: '#28a745',
      video: '#6c757d',
      default: theme.colors.text.secondary
    };
    return colors[fileType] || colors.default;
  }};
  font-size: ${({ viewMode, theme }) => 
    viewMode === 'grid' ? theme.fontSizes.xl : theme.fontSizes.lg
  };
  margin-bottom: ${({ viewMode, theme }) => 
    viewMode === 'grid' ? theme.spacing.md : '0'
  };
  flex-shrink: 0;
`;

const FileInfo = styled.div`
  flex: 1;
`;

const FileName = styled.h4`
  font-size: ${({ theme, viewMode }) => 
    viewMode === 'grid' ? theme.fontSizes.sm : theme.fontSizes.base
  };
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  margin-bottom: ${({ viewMode, theme }) => 
    viewMode === 'grid' ? theme.spacing.xs : '2px'
  };
  word-break: break-word;
  line-height: 1.3;
`;

const FileDetails = styled.div`
  display: flex;
  flex-direction: ${({ viewMode }) => viewMode === 'grid' ? 'column' : 'row'};
  gap: ${({ viewMode, theme }) => 
    viewMode === 'grid' ? theme.spacing.xs : theme.spacing.md
  };
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const FileActions = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  opacity: 0;
  transition: opacity 0.2s ease;

  ${FileItem}:hover & {
    opacity: 1;
  }
`;

const FileActionButton = styled.button`
  background: ${({ theme }) => theme.colors.primary.yellow};
  color: ${({ theme }) => theme.colors.primary.black};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.xs};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary.yellowSecondary};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.muted};
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const FileExplorer = ({ userRole }) => {
  const { matterNumber } = useParams();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState(['wattsnewclassified']);
  const [loading, setLoading] = useState(false);
  
  // Mock data - In real app, this would come from S3 API
  const [folderStructure, setFolderStructure] = useState([
    {
      id: 'root',
      name: 'wattsnewclassified',
      type: 'folder',
      path: ['wattsnewclassified'],
      children: [
        {
          id: 'zantac',
          name: 'ZAN20241234',
          type: 'folder',
          path: ['wattsnewclassified', 'ZAN20241234'],
          children: [
            {
              id: 'zantac-docs',
              name: 'documents',
              type: 'folder',
              children: [
                { id: 'doc1', name: 'medical_report_001.pdf', type: 'file', size: '2.4 MB', modified: '2024-01-15', fileType: 'pdf' },
                { id: 'doc2', name: 'client_intake_form.docx', type: 'file', size: '156 KB', modified: '2024-01-14', fileType: 'doc' },
              ]
            },
            {
              id: 'zantac-evidence',
              name: 'evidence',
              type: 'folder',
              children: [
                { id: 'ev1', name: 'prescription_bottle.jpg', type: 'file', size: '3.2 MB', modified: '2024-01-13', fileType: 'image' },
              ]
            }
          ]
        },
        {
          id: 'nec',
          name: 'NEC20241456',
          type: 'folder',
          path: ['wattsnewclassified', 'NEC20241456'],
          children: [
            {
              id: 'nec-medical',
              name: 'medical_records',
              type: 'folder',
              children: [
                { id: 'med1', name: 'hospital_records.pdf', type: 'file', size: '15.7 MB', modified: '2024-01-12', fileType: 'pdf' },
                { id: 'med2', name: 'diagnosis_summary.pdf', type: 'file', size: '892 KB', modified: '2024-01-11', fileType: 'pdf' },
              ]
            }
          ]
        },
        {
          id: 'hr',
          name: 'HR20241789',
          type: 'folder',
          path: ['wattsnewclassified', 'HR20241789'],
          children: [
            {
              id: 'hr-legal',
              name: 'legal_documents',
              type: 'folder',
              children: [
                { id: 'legal1', name: 'affidavit.pdf', type: 'file', size: '1.1 MB', modified: '2024-01-10', fileType: 'pdf' },
                { id: 'legal2', name: 'expert_testimony.mp4', type: 'file', size: '45.3 MB', modified: '2024-01-09', fileType: 'video' },
              ]
            }
          ]
        }
      ]
    }
  ]);

  const [currentFolder, setCurrentFolder] = useState(folderStructure[0]);

  // Get file icon based on type
  const getFileIcon = (fileType, isFolder = false) => {
    if (isFolder) return FiFolder;
    
    const iconMap = {
      pdf: FiFileText,
      doc: FiFileText,
      docx: FiFileText,
      image: FiImage,
      jpg: FiImage,
      png: FiImage,
      gif: FiImage,
      video: FiVideo,
      mp4: FiVideo,
      mov: FiVideo,
      audio: FiMusic,
      mp3: FiMusic,
      wav: FiMusic,
      default: FiFile
    };
    
    return iconMap[fileType] || iconMap.default;
  };

  // Navigate to folder
  const navigateToFolder = (folder) => {
    setCurrentFolder(folder);
    setCurrentPath(folder.path || [folder.name]);
    setSelectedFiles([]);
  };

  // Handle file selection
  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!currentFolder.children) return [];
    
    return currentFolder.children.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentFolder.children, searchQuery]);

  // Render folder tree
  const renderFolderTree = (folders, depth = 0) => {
    return folders.map(folder => (
      <FolderItem 
        key={folder.id}
        depth={depth}
        className={currentFolder.id === folder.id ? 'active' : ''}
        onClick={() => navigateToFolder(folder)}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        {folder.children && folder.children.length > 0 ? 
          <FiFolderOpen /> : <FiFolder />
        }
        {folder.name}
      </FolderItem>
    ));
  };

  return (
    <FileExplorerContainer>
      {/* Header */}
      <ExplorerHeader>
        <HeaderLeft>
          <HeaderTitle>File Explorer</HeaderTitle>
          <Breadcrumb>
            {currentPath.map((path, index) => (
              <BreadcrumbItem 
                key={index} 
                isActive={index === currentPath.length - 1}
              >
                {path}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </HeaderLeft>
        
        <HeaderRight>
          <SearchBox>
            <SearchIcon><FiSearch /></SearchIcon>
            <SearchInput
              placeholder="Buscar archivos y carpetas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBox>
          
          <ViewToggle>
            <ViewButton 
              isActive={viewMode === 'grid'} 
              onClick={() => setViewMode('grid')}
            >
              <FiGrid />
            </ViewButton>
            <ViewButton 
              isActive={viewMode === 'list'} 
              onClick={() => setViewMode('list')}
            >
              <FiList />
            </ViewButton>
          </ViewToggle>
        </HeaderRight>
      </ExplorerHeader>

      <ExplorerBody>
        {/* Sidebar */}
        <Sidebar>
          <SidebarSection>
            <SidebarTitle>Matter Folders</SidebarTitle>
            <FolderTree>
              {renderFolderTree(folderStructure)}
            </FolderTree>
          </SidebarSection>
          
          <SidebarSection>
            <SidebarTitle>Quick Filters</SidebarTitle>
            <FolderItem>
              <FiFileText />
              PDFs (234)
            </FolderItem>
            <FolderItem>
              <FiImage />
              Images (67)
            </FolderItem>
            <FolderItem>
              <FiVideo />
              Videos (12)
            </FolderItem>
          </SidebarSection>
        </Sidebar>

        {/* Main Content */}
        <MainContent>
          <ContentHeader>
            <ContentTitle>{currentFolder.name}</ContentTitle>
            <ActionButtons>
              <ActionButton whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <FiUpload />
                Upload
              </ActionButton>
              <ActionButton 
                primary
                disabled={selectedFiles.length === 0}
                whileHover={{ scale: selectedFiles.length > 0 ? 1.05 : 1 }} 
                whileTap={{ scale: selectedFiles.length > 0 ? 0.95 : 1 }}
              >
                <FiDownload />
                Download ({selectedFiles.length})
              </ActionButton>
            </ActionButtons>
          </ContentHeader>

          {filteredFiles.length > 0 ? (
            <FileGrid viewMode={viewMode}>
              <AnimatePresence>
                {filteredFiles.map((file) => {
                  const IconComponent = getFileIcon(file.fileType, file.type === 'folder');
                  return (
                    <FileItem
                      key={file.id}
                      viewMode={viewMode}
                      className={selectedFiles.includes(file.id) ? 'selected' : ''}
                      onClick={() => {
                        if (file.type === 'folder') {
                          navigateToFolder(file);
                        } else {
                          toggleFileSelection(file.id);
                        }
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FileIcon viewMode={viewMode} fileType={file.fileType}>
                        <IconComponent />
                      </FileIcon>
                      
                      <FileInfo>
                        <FileName viewMode={viewMode}>{file.name}</FileName>
                        {file.type === 'file' && (
                          <FileDetails viewMode={viewMode}>
                            <span>{file.size}</span>
                            <span>{file.modified}</span>
                          </FileDetails>
                        )}
                      </FileInfo>

                      {file.type === 'file' && (
                        <FileActions>
                          <FileActionButton title="View">
                            <FiEye />
                          </FileActionButton>
                          <FileActionButton title="Download">
                            <FiDownload />
                          </FileActionButton>
                          <FileActionButton title="Share">
                            <FiShare2 />
                          </FileActionButton>
                        </FileActions>
                      )}
                    </FileItem>
                  );
                })}
              </AnimatePresence>
            </FileGrid>
          ) : (
            <EmptyState>
              <EmptyIcon><FiFolder /></EmptyIcon>
              <EmptyText>No files found</EmptyText>
              <p>This folder is empty or no files match your search.</p>
            </EmptyState>
          )}
        </MainContent>
      </ExplorerBody>
    </FileExplorerContainer>
  );
};

export default FileExplorer; 