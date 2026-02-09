import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
  Input,
  FormControl,
  FormLabel,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from 'contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { deleteAgency } from 'services/supabaseService';

export default function DeleteAgencyConfirmModal({
  isOpen,
  onClose,
  organization,
}) {
  const toast = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const inputBg = useColorModeValue('white', 'navy.800');
  const placeholderColor = useColorModeValue('gray.400', 'gray.500');

  const expectedText = organization ? `${organization.name} 삭제에 동의합니다` : '';

  const handleDelete = async () => {
    if (confirmText !== expectedText) {
      toast({
        title: '확인 텍스트 불일치',
        description: `"${expectedText}"를 정확히 입력해주세요.`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    try {
      setIsDeleting(true);

      // 에이전시 삭제 (소속 브랜드, 사용자 완전 삭제)
      await deleteAgency(organization.id, organization.name);

      toast({
        title: '에이전시 삭제 완료',
        description: `${organization.name} 에이전시와 관련된 모든 데이터가 삭제되었습니다.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });

      // 로그아웃 및 리다이렉트
      setTimeout(async () => {
        await signOut();
        navigate('/auth/sign-in');
      }, 1000);

    } catch (error) {
      console.error('[DeleteAgencyConfirmModal] Error deleting agency:', error);
      toast({
        title: '삭제 실패',
        description: error.message || '에이전시 삭제 중 오류가 발생했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('');
      onClose();
    }
  };

  if (!organization) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" closeOnOverlayClick={!isDeleting}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize="md" fontWeight="600" color="red.500">
          에이전시 삭제 확인
        </ModalHeader>
        <ModalCloseButton isDisabled={isDeleting} />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Alert status="error" borderRadius="8px">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                이 작업은 되돌릴 수 없습니다. 에이전시와 관련된 모든 데이터가 영구적으로 삭제됩니다.
              </AlertDescription>
            </Alert>

            <Text fontSize="sm" color={textColor} fontWeight="500">
              다음 데이터가 영구적으로 삭제됩니다:
            </Text>

            <VStack align="stretch" spacing={2} pl={4}>
              <Text fontSize="sm" color={textColor}>• 에이전시 조직 정보</Text>
              <Text fontSize="sm" color={textColor}>
                • 소속 브랜드 ({organization.advertisers?.length || 0}개)
              </Text>
              <Text fontSize="sm" color={textColor}>• 모든 소속 직원 계정</Text>
              <Text fontSize="sm" color={textColor}>• 관련 광고 데이터</Text>
            </VStack>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500" color={textColor}>
                확인을 위해 "{expectedText}"를 입력하세요
              </FormLabel>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={expectedText}
                bg={inputBg}
                border="1px solid"
                borderColor={borderColor}
                color={textColor}
                fontSize="sm"
                h="44px"
                borderRadius="12px"
                _placeholder={{ color: placeholderColor }}
                isDisabled={isDeleting}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            fontSize="sm"
            isDisabled={isDeleting}
          >
            취소
          </Button>
          <Button
            colorScheme="red"
            onClick={handleDelete}
            fontSize="sm"
            fontWeight="500"
            isLoading={isDeleting}
            loadingText="삭제 중..."
            isDisabled={confirmText !== expectedText}
          >
            에이전시 삭제
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
