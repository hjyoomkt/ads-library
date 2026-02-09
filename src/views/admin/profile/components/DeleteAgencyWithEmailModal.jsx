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
  AlertTitle,
  AlertDescription,
  Input,
  FormControl,
  FormLabel,
  useToast,
  useColorModeValue,
  HStack,
  PinInput,
  PinInputField,
  Box,
} from '@chakra-ui/react';
import {
  sendAgencyDeletionEmail,
  verifyAgencyDeletionCode,
  deleteAgency,
} from 'services/supabaseService';
import { useAuth } from 'contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DeleteAgencyWithEmailModal({
  isOpen,
  onClose,
  organization,
}) {
  const toast = useToast();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  // 단계: 'confirm' → 'code'
  const [step, setStep] = useState('confirm');
  const [confirmText, setConfirmText] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const inputBg = useColorModeValue('white', 'navy.800');
  const alertBg = useColorModeValue('red.50', 'red.900');
  const expectedText = `${organization?.name} 삭제에 동의합니다`;

  const handleClose = () => {
    if (!isProcessing) {
      setStep('confirm');
      setConfirmText('');
      setVerificationCode('');
      setExpiresAt(null);
      onClose();
    }
  };

  // 1단계: 텍스트 확인 후 이메일 발송
  const handleSendEmail = async () => {
    if (confirmText !== expectedText) {
      toast({
        title: '확인 텍스트 불일치',
        description: '정확히 입력해주세요.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsProcessing(true);

      const result = await sendAgencyDeletionEmail(organization.id, organization.name);

      setExpiresAt(result.expires_at);
      setStep('code');

      toast({
        title: '확인 코드 발송',
        description: `${user.email}로 확인 코드를 발송했습니다.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('이메일 발송 실패:', error);
      toast({
        title: '이메일 발송 실패',
        description: error.message || '오류가 발생했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2단계: 코드 검증 후 삭제
  const handleVerifyAndDelete = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      toast({
        title: '코드 입력 필요',
        description: '6자리 확인 코드를 입력하세요.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsProcessing(true);

      // 코드 검증 (대문자로 변환)
      const codeWithPrefix = `VERIFY-${verificationCode.toUpperCase()}`;
      const verifyResult = await verifyAgencyDeletionCode(codeWithPrefix, organization.id);

      if (!verifyResult.valid) {
        toast({
          title: '코드 검증 실패',
          description: verifyResult.reason,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // 에이전시 삭제
      await deleteAgency(organization.id, organization.name);

      toast({
        title: '에이전시 삭제 완료',
        description: '모든 데이터가 영구적으로 삭제되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // 로그아웃 및 리다이렉트
      await signOut();
      navigate('/auth/sign-in');

    } catch (error) {
      console.error('삭제 실패:', error);
      toast({
        title: '삭제 실패',
        description: error.message || '오류가 발생했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" closeOnOverlayClick={!isProcessing}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize="md" fontWeight="600" color="red.500">
          {step === 'confirm' && '에이전시 삭제 확인'}
          {step === 'code' && '확인 코드 입력'}
        </ModalHeader>
        <ModalCloseButton isDisabled={isProcessing} />
        <ModalBody>
          {step === 'confirm' && (
            <VStack align="stretch" spacing={4}>
              <Alert status="error" borderRadius="8px" bg={alertBg}>
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle fontSize="sm" mb={1}>
                    되돌릴 수 없는 작업입니다
                  </AlertTitle>
                  <AlertDescription fontSize="xs">
                    에이전시와 관련된 모든 데이터가 영구적으로 삭제됩니다.
                  </AlertDescription>
                </Box>
              </Alert>

              <Text fontSize="sm" color={textColor} fontWeight="500">
                다음 데이터가 영구적으로 삭제됩니다:
              </Text>

              <VStack align="stretch" spacing={2} pl={4}>
                <Text fontSize="sm" color={textColor}>• 에이전시 조직 정보</Text>
                <Text fontSize="sm" color={textColor}>
                  • 소속 브랜드 ({organization?.advertisers?.length || 0}개)
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
                  isDisabled={isProcessing}
                />
              </FormControl>
            </VStack>
          )}

          {step === 'code' && (
            <VStack align="stretch" spacing={4}>
              <Alert status="info" borderRadius="8px">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  {user?.email}로 확인 코드를 발송했습니다.
                </AlertDescription>
              </Alert>

              <Text fontSize="sm" color={textColor}>
                이메일에 포함된 <strong>VERIFY-XXXXXX</strong> 형식의 코드에서<br />
                하이픈 뒤 <strong>6자리 숫자/문자</strong>만 입력하세요.
              </Text>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500" color={textColor}>
                  확인 코드 (6자리)
                </FormLabel>
                <HStack justify="center" spacing={2}>
                  <PinInput
                    value={verificationCode}
                    onChange={setVerificationCode}
                    size="lg"
                    type="alphanumeric"
                    isDisabled={isProcessing}
                  >
                    <PinInputField
                      bg={inputBg}
                      borderColor={borderColor}
                      color={textColor}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                    <PinInputField
                      bg={inputBg}
                      borderColor={borderColor}
                      color={textColor}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                    <PinInputField
                      bg={inputBg}
                      borderColor={borderColor}
                      color={textColor}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                    <PinInputField
                      bg={inputBg}
                      borderColor={borderColor}
                      color={textColor}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                    <PinInputField
                      bg={inputBg}
                      borderColor={borderColor}
                      color={textColor}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                    <PinInputField
                      bg={inputBg}
                      borderColor={borderColor}
                      color={textColor}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </PinInput>
                </HStack>
              </FormControl>

              <Text fontSize="xs" color="gray.500" textAlign="center">
                코드는 10분간 유효합니다
              </Text>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('confirm')}
                isDisabled={isProcessing}
              >
                뒤로 가기
              </Button>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            fontSize="sm"
            isDisabled={isProcessing}
          >
            취소
          </Button>
          {step === 'confirm' && (
            <Button
              colorScheme="red"
              onClick={handleSendEmail}
              fontSize="sm"
              fontWeight="500"
              isLoading={isProcessing}
              loadingText="발송 중..."
              isDisabled={confirmText !== expectedText}
            >
              확인 코드 발송
            </Button>
          )}
          {step === 'code' && (
            <Button
              colorScheme="red"
              onClick={handleVerifyAndDelete}
              fontSize="sm"
              fontWeight="500"
              isLoading={isProcessing}
              loadingText="삭제 중..."
              isDisabled={verificationCode.length < 6}
            >
              에이전시 삭제
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
