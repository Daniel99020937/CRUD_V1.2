-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 21/10/2026 às 18:22
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `db_tarefas_saas`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `tarefas`
--

CREATE TABLE `tarefas` (
  `id` int(11) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `concluida` tinyint(1) DEFAULT 0,
  `prioridade` enum('Baixa','Media','Alta') DEFAULT 'Media',
  `data_vencimento` date DEFAULT NULL,
  `criado_em` datetime DEFAULT current_timestamp(),
  `concluido_em` datetime DEFAULT NULL,
  `usuario_id` int(11) DEFAULT 1,
  `atualizado_por` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `tarefas`
--

INSERT INTO `tarefas` (`id`, `descricao`, `concluida`, `prioridade`, `data_vencimento`, `criado_em`, `concluido_em`, `usuario_id`, `atualizado_por`) VALUES
(12, 'alfa', 1, 'Media', NULL, '2026-10-21 10:19:03', '2026-10-21 11:54:44', 3, 3),
(17, 'sgf', 0, 'Baixa', NULL, '2026-10-21 10:20:30', NULL, 3, 3),
(19, 'a', 1, 'Baixa', NULL, '2026-10-21 10:55:40', '2026-10-21 11:44:27', 3, 3),
(24, 'alfaae', 1, 'Alta', NULL, '2026-10-21 11:44:41', '2026-10-21 12:01:25', 3, 3),
(25, 'alfaas', 0, 'Media', NULL, '2026-10-21 11:44:51', NULL, 3, 3),
(26, 'afag', 1, 'Alta', NULL, '2026-10-21 11:45:06', '2026-10-21 12:01:26', 3, 3),
(27, 'asdf', 0, 'Alta', NULL, '2026-10-21 11:45:24', NULL, 3, 3),
(28, 'asdfsa', 0, 'Baixa', NULL, '2026-10-21 11:45:28', NULL, 3, 3),
(29, 'sdgag', 0, 'Baixa', NULL, '2026-10-21 11:45:33', NULL, 3, 3),
(30, 'asdgasga', 0, 'Baixa', NULL, '2026-10-21 11:45:37', NULL, 3, 3),
(33, 'xxxxxxxxxxx', 0, 'Alta', NULL, '2026-10-21 12:22:01', NULL, 3, 3);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `senha_hash` varchar(255) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `google_id`, `senha_hash`, `criado_em`) VALUES
(2, 'Alfa', 'alfa@saas.com', NULL, '$2b$10$HuCLr0i0FOrXHcbzq/hetetMRzhDow/q9BlCoCXXrqQGbU5e1mXHy', '2026-10-19 14:29:39'),
(3, 'Tech Lead SaaS', 'techlead@saas.com', 'mock_google_id_12345', NULL, '2026-10-20 15:02:53');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `tarefas`
--
ALTER TABLE `tarefas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `atualizado_por` (`atualizado_por`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `google_id` (`google_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `tarefas`
--
ALTER TABLE `tarefas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `tarefas`
--
ALTER TABLE `tarefas`
  ADD CONSTRAINT `tarefas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tarefas_ibfk_2` FOREIGN KEY (`atualizado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
